//Statement to allow easy inheritance
function inheritsFrom(childClass, parentClassOrObject ){ 
	if ( parentClassOrObject.constructor == Function ) 
	{ 
		//Normal Inheritance 
		childClass.prototype = new parentClassOrObject;
		childClass.prototype.constructor = childClass;
		childClass.prototype.parent = parentClassOrObject.prototype;
	} 
	else 
	{ 
		//Pure Virtual Inheritance 
		childClass.prototype = parentClassOrObject;
		childClass.prototype.constructor = childClass;
		childClass.prototype.parent = parentClassOrObject;
	} 
	return childClass;
};

module.exports = inheritsFrom;
